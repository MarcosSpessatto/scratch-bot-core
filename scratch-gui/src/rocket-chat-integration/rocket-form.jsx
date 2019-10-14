import React, { Component } from 'react';
import Cat from '../../static/cat.png';
import swal from 'sweetalert';

export class RocketForm extends Component {

	constructor(props) {
		super(props);
		this.state = {
			name: '',
			email: '',
			username: '',
			password: '',
			rePassword: '',
			wantToBeTutor: false,
			loading: false,
		};
		this.onSubmit = this.onSubmit.bind(this);
		this.onChangeValue = this.onChangeValue.bind(this);
		this.rcAuth = {
			authToken: '',
			userId: '',
		};
		this.url = process.env.RC_URL;
	}

	doRCLogin() {
		return fetch(`${this.url}/api/v1/login`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: 'admin',
				password: 'admin',
			})
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success === false) {
					throw new Error(res.errorType);
				}
				this.rcAuth.authToken = res.data.authToken;
				this.rcAuth.userId = res.data.userId;
			})
	}

	createRCUser() {
		const { email, password, name, username } = this.state;
		const roles = ['student', 'user'];
		if (this.state.wantToBeTutor) {
			roles.push('tutor');
		}
		return fetch(`${this.url}/api/v1/users.create`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Auth-Token': this.rcAuth.authToken,
				'X-User-Id': this.rcAuth.userId,
			},
			body: JSON.stringify({
				email,
				username,
				password,
				name,
				verified: true,
				active: true,
				roles,
			})
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success === false) {
					throw new Error(res.errorType);
				}
				return res.user;
			});
	}

	verifyIfRCUserAlreadyExists() {
		const { username } = this.state;
		return fetch(`${this.url}/api/v1/users.info?username=${username}`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Auth-Token': this.rcAuth.authToken,
				'X-User-Id': this.rcAuth.userId,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success === false && res.errorType !== 'error-invalid-user') {
					throw new Error(res.errorType);
				}
				return res.user;
			});
	}

	saveUserOnLocalStorageAndShowStatus(user) {
		const { _id, email, name, username } = user;
		localStorage.setItem('rocketUser', JSON.stringify({ _id, email, name, username }));
		const html = document.createElement("div");
		html.innerHTML = `Usuário: <b>${this.state.username}</b><br> Para acessar o grupo de estudos no Rocket.Chat, acesse: <a href="${process.env.RC_URL}/channel/scratch" target="_blank">Rocket.Chat</a>`;

		swal({
			icon: 'success',
			title: 'Seu usuário foi criado no Rocket.Chat',
			content: html,
		});
		this.setState({ loading: false });
		this.props.onRocketRegisterDone();
	}

	onSubmit(event) {
		event.preventDefault();
		if (this.state.password !== this.state.rePassword) {
			return swal('As senhas não são iguais!', '', 'warning');
		}

		if (!this.state.email || !this.state.name || !this.state.password || !this.state.username) {
			return swal('Por favor preecha todos os campos!', '', 'warning');
		}
		this.setState({ loading: true });
		this.doRCLogin()
			.then(() => this.verifyIfRCUserAlreadyExists())
			.then((user) => {
				if (!user) {
					return this.createRCUser();
				}
				return user;
			})
			.then((user) => this.saveUserOnLocalStorageAndShowStatus(user))
			.catch((e) => swal('Ops, parece que o email ou o nome de usuário já estão sendo usados', '', 'error'));
	}

	onChangeValue(field, value) {
		this.setState({ [field]: value });
	}

	renderForm() {
		return (
			<div style={{ padding: '30px' }}>
				<div className="row">
					<div className="input-field col s12">
						<input id="name" name="name" type="text" value={this.state.name} onChange={(event) => this.onChangeValue('name', event.target.value)} />
						<label htmlFor="name">Nome</label>
					</div>
					<div className="input-field col s12">
						<input id="email" name="email" type="email" value={this.state.email} onChange={(event) => this.onChangeValue('email', event.target.value)} />
						<label htmlFor="email">Email</label>
					</div>
					<div className="input-field col s12">
						<input id="username" name="username" type="text" value={this.state.username} onChange={(event) => this.onChangeValue('username', event.target.value)} />
						<label htmlFor="username">Nome de Usuário</label>
					</div>
					<div className="input-field col s12">
						<input id="password" name="password" type="password" value={this.state.password} onChange={(event) => this.onChangeValue('password', event.target.value)} />
						<label htmlFor="password">Senha</label>
					</div>
					<div className="input-field col s12">
						<input id="rePassword" name="rePassword" type="password" value={this.state.rePassword} onChange={(event) => this.onChangeValue('rePassword', event.target.value)} />
						<label htmlFor="rePassword">Repetir Senha</label>
					</div>
					<div className="col s12">
						<label>
							<input id="wantToBeTutor" name="wantToBeTutor" type="checkbox" value={this.state.wantToBeTutor} onChange={(event) => this.onChangeValue('wantToBeTutor', event.target.checked)} />
							<span>Desejo ajudar outros alunos respondendo as dúvidas</span>
						</label>
					</div>
				</div>
				<div className="center">
					<button className="waves-effect waves-light btn" type="submit">Enviar</button>
				</div>
			</div>

		);
	}

	renderLoading() {
		return (
			<div style={{ padding: '30px' }} className="center">
				<div className="preloader-wrapper big active">
					<div className="spinner-layer spinner-blue-only">
						<div className="circle-clipper left">
							<div className="circle"></div>
						</div><div className="gap-patch">
							<div className="circle"></div>
						</div><div className="circle-clipper right">
							<div className="circle"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return (
			<div className="container">
				<div className="row">
					<div className="card col s10 l8 m10 offset-l2 offset-m1 offset-s1">
						<div className="center">
							<h4 style={{ fontWeight: 'bold' }}>Seja Bem vindo</h4>
							<img style={{ width: '15%', marginTop: '8px' }} src={Cat} />
						</div>
						<form className="col s12" style={{ backgroundColor: 'white', borderRadius: '15px' }} onSubmit={this.onSubmit}>
							<div style={{ paddingTop: '10px' }} className="center">
								<h5>Vamos criar um usuário</h5>
							</div>
							{
								this.state.loading
									? this.renderLoading()
									: this.renderForm()
							}
						</form>
					</div>
				</div>
			</div>
		);
	}
}
